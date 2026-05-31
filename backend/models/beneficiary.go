package models

import "time"

type Beneficiary struct {
	ID        string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	UserID    string    `gorm:"not null;type:uuid;index" json:"user_id"`
	Name      string    `gorm:"not null" json:"name"`
	Phone     string    `gorm:"not null" json:"phone"`
	Nickname  string    `json:"nickname,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}
