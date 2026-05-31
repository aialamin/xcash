package models

import "time"

type Loan struct {
	ID          string     `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	UserID      string     `gorm:"not null;type:uuid;index" json:"user_id"`
	Amount      float64    `gorm:"not null" json:"amount"`
	Tenure      int        `gorm:"not null" json:"tenure"`
	EMIAmount   float64    `json:"emi_amount"`
	PaidAmount  float64    `gorm:"default:0" json:"paid_amount"`
	Status      string     `gorm:"default:'pending'" json:"status"`
	DueDate     *time.Time `json:"due_date,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}
