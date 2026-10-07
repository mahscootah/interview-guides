/*
 * awdl-warden.c - keep awdl0 down while protection is on.
 *
 * A personal, stripped-down take on Ping Warden's privileged helper
 * (https://github.com/oliverames/ping-warden, MIT, Copyright (c) 2025-2026
 * Oliver Ames), itself based on jamestut/awdlkiller.
 *
 * Runs as root under launchd. Reads the desired mode from a small state file
 * that the unprivileged `pingwarden` CLI writes:
 *
 *     on                 keep awdl0 down
 *     off                leave awdl0 alone (restore it if we lowered it)
 *     pause <epoch>      treat as off until <epoch>, then as on
 *
 * While blocking, it wakes on AF_ROUTE messages (the kernel announces
 * interface changes there) and on a periodic timeout, and lowers awdl0
 * whenever it finds the interface up. Route messages only mean "look now";
 * the interface flags are the source of truth, so dropped messages are
 * harmless.
 */

#include <sys/types.h>
#include <sys/ioctl.h>
#include <sys/socket.h>
#include <sys/stat.h>
#include <net/if.h>
#include <errno.h>
#include <fcntl.h>
#include <poll.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <syslog.h>
#include <time.h>
#include <unistd.h>

#define DEFAULT_IFNAME      "awdl0"
#define DEFAULT_DIR         "/usr/local/var/ping-warden"
#define BLOCK_INTERVAL_MS   2000   /* reconcile at least this often while blocking */
#define IDLE_INTERVAL_MS    1000   /* how often to re-read the mode while idle */
#define RETRY_INTERVAL_MS   250    /* after a failed write */

enum mode { MODE_OFF, MODE_ON };

static volatile sig_atomic_t g_stop = 0;

static const char *g_ifname = DEFAULT_IFNAME;
static char g_state_path[512];
static char g_status_path[512];
static char g_marker_path[512];   /* exists while we hold awdl0 down */

static int  g_iocfd = -1;
static int  g_rtfd = -1;
static int  g_lowered_by_us = 0;
static long g_interventions = 0;
static time_t g_started;

static void on_signal(int sig) { (void)sig; g_stop = 1; }

/* Returns 0 and fills *flags, or -1 (errno set). */
static int get_flags(short *flags) {
    struct ifreq ifr;
    memset(&ifr, 0, sizeof(ifr));
    strncpy(ifr.ifr_name, g_ifname, IFNAMSIZ - 1);
    if (ioctl(g_iocfd, SIOCGIFFLAGS, &ifr) < 0) return -1;
    *flags = ifr.ifr_flags;
    return 0;
}

/* Bring the interface up or down and confirm. Returns 0 on success. */
static int set_up(int up) {
    struct ifreq ifr;
    memset(&ifr, 0, sizeof(ifr));
    strncpy(ifr.ifr_name, g_ifname, IFNAMSIZ - 1);
    if (ioctl(g_iocfd, SIOCGIFFLAGS, &ifr) < 0) return -1;
    if (!!(ifr.ifr_flags & IFF_UP) != up) {
        if (up) ifr.ifr_flags |= IFF_UP;
        else    ifr.ifr_flags &= ~IFF_UP;
        if (ioctl(g_iocfd, SIOCSIFFLAGS, &ifr) < 0) return -1;
    }
    if (ioctl(g_iocfd, SIOCGIFFLAGS, &ifr) < 0) return -1;
    return (!!(ifr.ifr_flags & IFF_UP) == up) ? 0 : -1;
}

/* Read the desired mode. A missing or unreadable file means off. */
static enum mode read_mode(time_t *pause_until) {
    char buf[64] = {0};
    *pause_until = 0;
    int fd = open(g_state_path, O_RDONLY | O_NOFOLLOW);
    if (fd < 0) return MODE_OFF;
    ssize_t n = read(fd, buf, sizeof(buf) - 1);
    close(fd);
    if (n <= 0) return MODE_OFF;
    buf[n] = '\0';

    if (strncmp(buf, "on", 2) == 0) return MODE_ON;
    if (strncmp(buf, "pause", 5) == 0) {
        long long until = atoll(buf + 5);
        if (until > 0 && time(NULL) < (time_t)until) {
            *pause_until = (time_t)until;
            return MODE_OFF;
        }
        return MODE_ON;   /* pause expired: back to protecting */
    }
    return MODE_OFF;
}

static void write_status(enum mode mode, time_t pause_until) {
    short flags = 0;
    const char *awdl = "missing";
    if (get_flags(&flags) == 0) awdl = (flags & IFF_UP) ? "up" : "down";

    char tmp[600];
    snprintf(tmp, sizeof(tmp), "%s.tmp", g_status_path);
    FILE *f = fopen(tmp, "w");
    if (!f) return;
    fprintf(f, "pid=%d\nstarted=%lld\nmode=%s\npause_until=%lld\nawdl=%s\ninterventions=%ld\n",
            (int)getpid(), (long long)g_started,
            mode == MODE_ON ? "on" : (pause_until ? "paused" : "off"),
            (long long)pause_until, awdl, g_interventions);
    fclose(f);
    chmod(tmp, 0644);
    rename(tmp, g_status_path);
}

/* Lower awdl0 if it is up. Returns 0 when it is down (or absent). */
static int enforce(void) {
    short flags = 0;
    if (get_flags(&flags) < 0) {
        return errno == ENXIO ? 0 : -1;   /* ENXIO: no awdl0 on this Mac */
    }
    if (!(flags & IFF_UP)) return 0;

    g_interventions++;
    if (g_interventions <= 10 || g_interventions % 100 == 0) {
        syslog(LOG_NOTICE, "%s came up; lowering it (intervention #%ld)", g_ifname, g_interventions);
    }
    if (set_up(0) < 0) {
        syslog(LOG_ERR, "could not lower %s: %s", g_ifname, strerror(errno));
        return -1;
    }
    if (!g_lowered_by_us) {
        int fd = open(g_marker_path, O_WRONLY | O_CREAT | O_NOFOLLOW, 0644);
        if (fd >= 0) close(fd);
    }
    g_lowered_by_us = 1;
    return 0;
}

static void restore(void) {
    if (!g_lowered_by_us) return;
    if (set_up(1) == 0) {
        g_lowered_by_us = 0;
        unlink(g_marker_path);
        syslog(LOG_NOTICE, "restored %s", g_ifname);
    } else {
        syslog(LOG_ERR, "could not restore %s: %s", g_ifname, strerror(errno));
    }
}

static void drain_route_socket(void) {
    char buf[2048];
    while (read(g_rtfd, buf, sizeof(buf)) > 0) { /* contents don't matter */ }
}

static void usage(const char *argv0) {
    fprintf(stderr, "usage: %s [-i ifname] [-d state_dir]\n", argv0);
    exit(2);
}

int main(int argc, char **argv) {
    const char *dir = DEFAULT_DIR;
    int ch;
    while ((ch = getopt(argc, argv, "i:d:h")) != -1) {
        switch (ch) {
            case 'i': g_ifname = optarg; break;
            case 'd': dir = optarg; break;
            default:  usage(argv[0]);
        }
    }
    snprintf(g_state_path, sizeof(g_state_path), "%s/state", dir);
    snprintf(g_status_path, sizeof(g_status_path), "%s/status", dir);
    snprintf(g_marker_path, sizeof(g_marker_path), "%s/lowered", dir);
    /* A marker left by a crashed run means awdl0 is down with no owner:
       adopt it so we restore it once protection is off. */
    g_lowered_by_us = access(g_marker_path, F_OK) == 0;

    openlog("awdl-warden", LOG_PID, LOG_DAEMON);
    g_started = time(NULL);

    /* No SA_RESTART, so poll() returns EINTR and the loop sees g_stop. */
    struct sigaction sa;
    memset(&sa, 0, sizeof(sa));
    sa.sa_handler = on_signal;
    sigaction(SIGTERM, &sa, NULL);
    sigaction(SIGINT, &sa, NULL);
    sigaction(SIGHUP, &sa, NULL);

    g_iocfd = socket(AF_INET, SOCK_DGRAM, 0);
    if (g_iocfd < 0) { syslog(LOG_ERR, "socket(AF_INET): %s", strerror(errno)); return 1; }

    g_rtfd = socket(AF_ROUTE, SOCK_RAW, 0);
    if (g_rtfd < 0) {
        syslog(LOG_WARNING, "socket(AF_ROUTE): %s; using periodic checks only", strerror(errno));
    } else {
        fcntl(g_rtfd, F_SETFL, O_NONBLOCK);
        int rcvbuf = 256 * 1024;
        setsockopt(g_rtfd, SOL_SOCKET, SO_RCVBUF, &rcvbuf, sizeof(rcvbuf));
    }

    syslog(LOG_NOTICE, "started; watching %s, state file %s", g_ifname, g_state_path);

    int pending = 0;
    enum mode last_mode = MODE_OFF;
    time_t last_pause = -1;
    time_t last_status = 0;
    long last_interventions = -1;

    while (!g_stop) {
        time_t pause_until;
        enum mode mode = read_mode(&pause_until);

        if (mode == MODE_ON) {
            pending = enforce() < 0;
        } else {
            restore();
        }

        time_t now = time(NULL);
        if (mode != last_mode || pause_until != last_pause ||
            g_interventions != last_interventions || now - last_status >= 5) {
            write_status(mode, pause_until);
            last_mode = mode;
            last_pause = pause_until;
            last_interventions = g_interventions;
            last_status = now;
        }

        int timeout = mode == MODE_ON ? (pending ? RETRY_INTERVAL_MS : BLOCK_INTERVAL_MS)
                                      : IDLE_INTERVAL_MS;
        struct pollfd pfd = { .fd = g_rtfd, .events = POLLIN, .revents = 0 };
        int watch = (mode == MODE_ON && g_rtfd >= 0);
        int ready = poll(watch ? &pfd : NULL, watch ? 1 : 0, timeout);
        if (ready > 0 && (pfd.revents & POLLIN)) drain_route_socket();
    }

    restore();
    unlink(g_status_path);
    syslog(LOG_NOTICE, "stopped after %ld interventions", g_interventions);
    if (g_rtfd >= 0) close(g_rtfd);
    close(g_iocfd);
    return 0;
}
