package solidtime

type User struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	Timezone  string `json:"timezone"`
	WeekStart string `json:"week_start"`
}

type PersonalMembership struct {
	ID           string `json:"id"`
	Role         string `json:"role"`
	Organization struct {
		ID       string `json:"id"`
		Name     string `json:"name"`
		Currency string `json:"currency"`
	} `json:"organization"`
}

type ClientResource struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type Project struct {
	ID           string  `json:"id"`
	Name         string  `json:"name"`
	Color        string  `json:"color"`
	ClientID     *string `json:"client_id"`
	IsArchived   bool    `json:"is_archived"`
	IsBillable   bool    `json:"is_billable"`
	BillableRate *int    `json:"billable_rate"`
}

type Task struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	IsDone    bool   `json:"is_done"`
	ProjectID string `json:"project_id"`
}

type TimeEntry struct {
	ID             string  `json:"id"`
	Start          string  `json:"start"`
	End            *string `json:"end"`
	Duration       *int    `json:"duration"`
	Description    *string `json:"description"`
	TaskID         *string `json:"task_id"`
	ProjectID      *string `json:"project_id"`
	OrganizationID string  `json:"organization_id"`
	UserID         string  `json:"user_id"`
	Billable       bool    `json:"billable"`
}

type TimeEntryStoreRequest struct {
	MemberID    string  `json:"member_id"`
	ProjectID   *string `json:"project_id,omitempty"`
	TaskID      *string `json:"task_id,omitempty"`
	Start       string  `json:"start"`
	End         *string `json:"end,omitempty"`
	Billable    bool    `json:"billable"`
	Description *string `json:"description,omitempty"`
}

type TimeEntryUpdateRequest struct {
	MemberID    *string `json:"member_id,omitempty"`
	ProjectID   *string `json:"project_id,omitempty"`
	TaskID      *string `json:"task_id,omitempty"`
	Start       *string `json:"start,omitempty"`
	End         *string `json:"end,omitempty"`
	Billable    *bool   `json:"billable,omitempty"`
	Description *string `json:"description,omitempty"`
}

type AggregateResult struct {
	Seconds int `json:"seconds"`
}
