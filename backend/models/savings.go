package models

import "time"

type Savings struct {
	ID             string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	UserID         string    `gorm:"not null;type:uuid;index" json:"user_id"`
	Type           string    `gorm:"default:'general'" json:"type"`
	TargetAmount   float64   `json:"target_amount"`
	CurrentAmount  float64   `gorm:"default:0" json:"current_amount"`
	MonthlyDeposit float64   `json:"monthly_deposit"`
	DueDate        *time.Time `json:"due_date,omitempty"`
	Status         string    `gorm:"default:'active'" json:"status"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}
