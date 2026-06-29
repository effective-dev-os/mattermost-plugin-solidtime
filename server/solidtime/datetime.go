package solidtime

import (
	"strings"
	"time"
)

// NormalizeDateTime converts to Solidtime's Y-m-d\TH:i:s\Z (no fractional seconds).
func NormalizeDateTime(s string) string {
	if s == "" {
		return ""
	}
	for _, layout := range []string{time.RFC3339Nano, time.RFC3339, "2006-01-02T15:04:05Z"} {
		if t, err := time.Parse(layout, s); err == nil {
			return t.UTC().Format("2006-01-02T15:04:05Z")
		}
	}
	if i := strings.Index(s, "."); i > 0 && strings.HasSuffix(s, "Z") {
		return s[:i] + "Z"
	}
	return s
}
