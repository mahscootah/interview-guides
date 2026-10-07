#!/bin/bash
# <swiftbar.title>Ping Warden Lite</swiftbar.title>
# <swiftbar.desc>Toggle AWDL protection from the menu bar.</swiftbar.desc>
# <swiftbar.hideRunInTerminal>true</swiftbar.hideRunInTerminal>
# <swiftbar.hideLastUpdated>true</swiftbar.hideLastUpdated>
#
# SwiftBar (or xbar) plugin. Copy into your plugin folder; it refreshes
# every 10 seconds.

PW=/usr/local/bin/pingwarden
STATUS=/usr/local/var/ping-warden/status
field() { sed -n "s/^$1=//p" "$STATUS" 2>/dev/null; }

mode="$(field mode)"; n="$(field interventions)"; awdl="$(field awdl)"
case "$mode" in
  on)     echo ":shield.fill: | sfcolor=#34c759" ;;
  paused) echo ":pause.circle: | sfcolor=#ff9f0a" ;;
  off)    echo ":shield.slash:" ;;
  *)      echo ":exclamationmark.triangle: | sfcolor=#ff3b30" ;;
esac
echo "---"
if [[ -z "$mode" ]]; then
  echo "awdl-warden is not running"
else
  echo "Ping Protection: $(echo "$mode" | tr a-z A-Z)"
  echo "awdl0: $awdl · interventions: ${n:-0} | size=12"
fi
echo "---"
echo "Turn On | bash=$PW param1=on terminal=false refresh=true"
echo "Turn Off | bash=$PW param1=off terminal=false refresh=true"
echo "Pause 10 Minutes | bash=$PW param1=pause param2=10 terminal=false refresh=true"
echo "---"
echo "Ping Test… | bash=$PW param1=ping terminal=true"
