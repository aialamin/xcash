package models

import "time"

type Wallet struct {
	ID        string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	UserID    string    `gorm:"uniqueIndex;not null;type:uuid" json:"user_id"`
	Balance   float64   `gorm:"default:0" json:"balance"`
	Currency  string    `gorm:"default:'BDT'" json:"currency"`
	IsLocked  bool      `gorm:"default:false" json:"is_locked"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
