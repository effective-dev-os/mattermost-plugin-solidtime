package kvstore

// OrgMembership is cached per user after connect.
type OrgMembership struct {
	OrgID    string `json:"org_id"`
	MemberID string `json:"member_id"`
	OrgName  string `json:"org_name"`
}
