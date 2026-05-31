package models

import "time"

type Notification struct {
	ID        string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	UserID    string    `gorm:"not null;type:uuid;index" json:"user_id"`
	Title     string    `gorm:"not null" json:"title"`
	Body      string    `gorm:"not null" json:"body"`
	Type      string    `gorm:"default:'general'" json:"type"`
	IsRead    bool      `gorm:"default:false" json:"is_read"`
	CreatedAt time.Time `gorm:"index" json:"created_at"`
}
