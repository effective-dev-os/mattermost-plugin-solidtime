package solidtime

import "fmt"

type APIError struct {
	StatusCode int
	Code       string
	Message    string
	Details    any
}

func (e *APIError) Error() string {
	return fmt.Sprintf("solidtime api error %d: %s", e.StatusCode, e.Message)
}

func AsAPIError(err error) (*APIError, bool) {
	apiErr, ok := err.(*APIError)
	return apiErr, ok
}
