package solidtime

import "testing"

func TestNormalizeDateTime(t *testing.T) {
	tests := []struct {
		in   string
		want string
	}{
		{"2026-06-28T21:00:00.000Z", "2026-06-28T21:00:00Z"},
		{"2026-07-05T20:59:59.999Z", "2026-07-05T20:59:59Z"},
		{"2026-06-28T21:00:00Z", "2026-06-28T21:00:00Z"},
		{"", ""},
	}
	for _, tt := range tests {
		if got := NormalizeDateTime(tt.in); got != tt.want {
			t.Fatalf("NormalizeDateTime(%q) = %q, want %q", tt.in, got, tt.want)
		}
	}
}
