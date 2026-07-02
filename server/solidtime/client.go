package solidtime

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const (
	maxPages          = 10
	maxTimeEntryPages = 5
	timeEntryPageSize = 100
)

type Client struct {
	baseURL    string
	httpClient *http.Client
}

func NewClient(serverURL string) *Client {
	base := strings.TrimSuffix(strings.TrimSpace(serverURL), "/")
	return &Client{
		baseURL: base + "/api/v1",
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

type AuthenticatedClient struct {
	parent *Client
	token  string
}

func (c *Client) WithToken(token string) *AuthenticatedClient {
	return &AuthenticatedClient{parent: c, token: token}
}

type dataEnvelope[T any] struct {
	Data T `json:"data"`
}

type paginatedEnvelope[T any] struct {
	Data  []T `json:"data"`
	Links struct {
		Next string `json:"next"`
	} `json:"links"`
}

func (a *AuthenticatedClient) GetMe() (*User, error) {
	var out dataEnvelope[User]
	if err := a.get("/users/me", nil, &out); err != nil {
		return nil, err
	}
	return &out.Data, nil
}

func (a *AuthenticatedClient) GetMemberships() ([]PersonalMembership, error) {
	var out dataEnvelope[[]PersonalMembership]
	if err := a.get("/users/me/memberships", nil, &out); err != nil {
		return nil, err
	}
	return out.Data, nil
}

func (a *AuthenticatedClient) GetProjects(orgID string) ([]Project, error) {
	return fetchAllPages[Project](a, fmt.Sprintf("/organizations/%s/projects", orgID), url.Values{"archived": {"false"}})
}

func (a *AuthenticatedClient) GetClients(orgID string) ([]ClientResource, error) {
	return fetchAllPages[ClientResource](a, fmt.Sprintf("/organizations/%s/clients", orgID), url.Values{"archived": {"false"}})
}

func (a *AuthenticatedClient) GetAllTasks(orgID string) ([]Task, error) {
	return fetchAllPages[Task](a, fmt.Sprintf("/organizations/%s/tasks", orgID), url.Values{"done": {"false"}})
}

type TimeEntryListParams struct {
	MemberID string
	Start    string
	End      string
	Limit    int
	Offset   int
	Active   string
}

func (a *AuthenticatedClient) GetTimeEntries(orgID string, params TimeEntryListParams) ([]TimeEntry, error) {
	q := url.Values{}
	if params.MemberID != "" {
		q.Set("member_id", params.MemberID)
	}
	if params.Start != "" {
		q.Set("start", NormalizeDateTime(params.Start))
	}
	if params.End != "" {
		q.Set("end", NormalizeDateTime(params.End))
	}
	if params.Limit > 0 {
		q.Set("limit", fmt.Sprintf("%d", params.Limit))
	}
	if params.Offset > 0 {
		q.Set("offset", fmt.Sprintf("%d", params.Offset))
	}
	active := params.Active
	if active == "" {
		active = "false"
	}
	q.Set("active", active)

	var out paginatedEnvelope[TimeEntry]
	path := fmt.Sprintf("/organizations/%s/time-entries", orgID)
	if err := a.get(path, q, &out); err != nil {
		return nil, err
	}
	if out.Data == nil {
		return []TimeEntry{}, nil
	}
	return out.Data, nil
}

func (a *AuthenticatedClient) GetAllTimeEntries(orgID string, params TimeEntryListParams) ([]TimeEntry, error) {
	params.Limit = timeEntryPageSize
	var all []TimeEntry
	for page := range maxTimeEntryPages {
		params.Offset = page * timeEntryPageSize
		batch, err := a.GetTimeEntries(orgID, params)
		if err != nil {
			return nil, err
		}
		all = append(all, batch...)
		if len(batch) < timeEntryPageSize {
			break
		}
	}
	if all == nil {
		all = []TimeEntry{}
	}
	return all, nil
}

func (a *AuthenticatedClient) DeleteTimeEntry(orgID, entryID string) error {
	path := fmt.Sprintf("/organizations/%s/time-entries/%s", orgID, entryID)
	return a.delete(path)
}

func (a *AuthenticatedClient) GetActiveTimeEntry() (*TimeEntry, error) {
	var out dataEnvelope[TimeEntry]
	if err := a.get("/users/me/time-entries/active", nil, &out); err != nil {
		if apiErr, ok := AsAPIError(err); ok && apiErr.StatusCode == http.StatusNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &out.Data, nil
}

func (a *AuthenticatedClient) CreateTimeEntry(orgID string, req TimeEntryStoreRequest) (*TimeEntry, error) {
	req.Start = NormalizeDateTime(req.Start)
	if req.End != nil {
		normalized := NormalizeDateTime(*req.End)
		req.End = &normalized
	}
	var out dataEnvelope[TimeEntry]
	path := fmt.Sprintf("/organizations/%s/time-entries", orgID)
	if err := a.post(path, req, &out); err != nil {
		return nil, err
	}
	return &out.Data, nil
}

func (a *AuthenticatedClient) UpdateTimeEntry(orgID, entryID string, req TimeEntryUpdateRequest) (*TimeEntry, error) {
	if req.Start != nil {
		normalized := NormalizeDateTime(*req.Start)
		req.Start = &normalized
	}
	if req.End != nil {
		normalized := NormalizeDateTime(*req.End)
		req.End = &normalized
	}
	var out dataEnvelope[TimeEntry]
	path := fmt.Sprintf("/organizations/%s/time-entries/%s", orgID, entryID)
	if err := a.put(path, req, &out); err != nil {
		return nil, err
	}
	return &out.Data, nil
}

type AggregateParams struct {
	MemberID string
	Start    string
	End      string
}

func (a *AuthenticatedClient) GetTimeEntriesAggregate(orgID string, params AggregateParams) (int, error) {
	q := url.Values{}
	if params.MemberID != "" {
		q.Set("member_id", params.MemberID)
	}
	if params.Start != "" {
		q.Set("start", NormalizeDateTime(params.Start))
	}
	if params.End != "" {
		q.Set("end", NormalizeDateTime(params.End))
	}

	var out dataEnvelope[AggregateResult]
	path := fmt.Sprintf("/organizations/%s/time-entries/aggregate", orgID)
	if err := a.get(path, q, &out); err != nil {
		return 0, err
	}
	return out.Data.Seconds, nil
}

func fetchAllPages[T any](a *AuthenticatedClient, path string, q url.Values) ([]T, error) {
	var all []T
	for page := range maxPages {
		if page > 0 {
			q.Set("page", fmt.Sprintf("%d", page+1))
		}
		var out paginatedEnvelope[T]
		if err := a.get(path, q, &out); err != nil {
			return nil, err
		}
		all = append(all, out.Data...)
		if out.Links.Next == "" {
			break
		}
	}
	return all, nil
}

func (a *AuthenticatedClient) get(path string, query url.Values, dest any) error {
	return a.do(http.MethodGet, path, query, nil, dest)
}

func (a *AuthenticatedClient) post(path string, body any, dest any) error {
	return a.do(http.MethodPost, path, nil, body, dest)
}

func (a *AuthenticatedClient) put(path string, body any, dest any) error {
	return a.do(http.MethodPut, path, nil, body, dest)
}

func (a *AuthenticatedClient) delete(path string) error {
	return a.do(http.MethodDelete, path, nil, nil, nil)
}

func (a *AuthenticatedClient) do(method, path string, query url.Values, body any, dest any) error {
	u := a.parent.baseURL + path
	if len(query) > 0 {
		u += "?" + query.Encode()
	}

	var bodyReader io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return err
		}
		bodyReader = strings.NewReader(string(b))
	}

	req, err := http.NewRequest(method, u, bodyReader)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+a.token)
	req.Header.Set("Accept", "application/json")
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := a.parent.httpClient.Do(req)
	if err != nil {
		return &APIError{StatusCode: http.StatusBadGateway, Code: "solidtime_unavailable", Message: "Solidtime server unavailable"}
	}
	defer func() { _ = resp.Body.Close() }()

	respBody, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return err
	}

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		if dest == nil {
			return nil
		}
		if err := json.Unmarshal(respBody, dest); err != nil {
			return err
		}
		return nil
	}

	return parseAPIError(resp.StatusCode, respBody)
}

func parseAPIError(status int, body []byte) error {
	apiErr := &APIError{StatusCode: status, Code: "solidtime_error", Message: string(body)}
	var parsed struct {
		Message string `json:"message"`
		Errors  any    `json:"errors"`
	}
	if json.Unmarshal(body, &parsed) == nil {
		if parsed.Message != "" {
			apiErr.Message = parsed.Message
		}
		apiErr.Details = parsed.Errors
	}
	switch status {
	case http.StatusUnauthorized:
		apiErr.Code = "solidtime_unauthorized"
	case http.StatusForbidden:
		apiErr.Code = "solidtime_forbidden"
	case http.StatusUnprocessableEntity:
		apiErr.Code = "solidtime_validation"
	}
	return apiErr
}
