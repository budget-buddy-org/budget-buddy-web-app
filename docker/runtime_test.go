package main

import "testing"

func TestOrigin(t *testing.T) {
	for input, want := range map[string]string{"": "'self'", "https://id.example/tenant": "https://id.example", "http://localhost:8080": "http://localhost:8080"} {
		got, err := origin(input)
		if err != nil || got != want {
			t.Fatalf("origin(%q) = %q, %v", input, got, err)
		}
	}
	for _, input := range []string{"javascript:alert(1)", "https://user:password@host", "https://host\";", "https://host\n", "https://host other", "https://$hostname"} {
		if _, err := origin(input); err == nil {
			t.Fatalf("accepted unsafe URL %q", input)
		}
	}
}
