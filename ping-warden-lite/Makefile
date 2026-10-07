# Ping Warden Lite - personal AWDL blocker for macOS.
#
#   make              build awdl-warden
#   sudo make install install the daemon, CLI and launchd job, and start it
#   sudo make uninstall  stop everything and restore awdl0

PREFIX   ?= /usr/local
STATEDIR ?= $(PREFIX)/var/ping-warden
LABEL     = local.pingwarden.awdl-warden
PLIST     = /Library/LaunchDaemons/$(LABEL).plist
# The user who ran sudo owns the state file, so toggling needs no password.
OWNER    ?= $(or $(SUDO_USER),$(shell id -un))

CFLAGS ?= -O2 -Wall -Wextra

awdl-warden: awdl-warden.c
	$(CC) $(CFLAGS) -o $@ $<

install: awdl-warden
	@[ "$$(id -u)" = 0 ] || { echo "run: sudo make install"; exit 1; }
	install -d $(PREFIX)/libexec $(PREFIX)/bin
	install -m 755 -o root -g wheel awdl-warden $(PREFIX)/libexec/awdl-warden
	install -m 755 pingwarden $(PREFIX)/bin/pingwarden
	install -d -m 755 -o $(OWNER) $(STATEDIR)
	[ -f $(STATEDIR)/state ] || { echo off > $(STATEDIR)/state; chown $(OWNER) $(STATEDIR)/state; }
	install -m 644 -o root -g wheel $(LABEL).plist $(PLIST)
	-launchctl bootout system/$(LABEL) 2>/dev/null
	launchctl bootstrap system $(PLIST)
	@echo "Installed. Try: pingwarden on"

uninstall:
	@[ "$$(id -u)" = 0 ] || { echo "run: sudo make uninstall"; exit 1; }
	-launchctl bootout system/$(LABEL)
	-ifconfig awdl0 up
	rm -f $(PLIST) $(PREFIX)/libexec/awdl-warden $(PREFIX)/bin/pingwarden
	rm -rf $(STATEDIR)

clean:
	rm -f awdl-warden

.PHONY: install uninstall clean
