package kvstore

type KVStore interface {
	SetToken(userID, token string) error
	GetToken(userID string) (string, bool, error)
	SetOrgID(userID, orgID string) error
	GetOrgID(userID string) (string, bool, error)
	SetMemberID(userID, memberID string) error
	GetMemberID(userID string) (string, bool, error)
	SetMemberships(userID string, memberships []OrgMembership) error
	GetMemberships(userID string) ([]OrgMembership, bool, error)
	DeleteUserData(userID string) error
}
