package models

import "time"

type SupportTicket struct {
	ID       string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	UserID   string    `gorm:"type:uuid;index" json:"user_id"`
	Subject  string    `gorm:"not null" json:"subject"`
	Status   string    `gorm:"default:'open'" json:"status"` // open, in_progress, resolved, closed
	Category string    `json:"category"`                      // payment, account, technical, other
	Priority string    `gorm:"default:'normal'" json:"priority"` // low, normal, high, urgent
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	User     *User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Messages []SupportMessage `gorm:"foreignKey:TicketID" json:"messages,omitempty"`
}

type SupportMessage struct {
	ID        string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	TicketID  string    `gorm:"type:uuid;index" json:"ticket_id"`
	SenderID  string    `gorm:"type:uuid" json:"sender_id"`
	Message   string    `gorm:"not null" json:"message"`
	IsAdmin   bool      `gorm:"default:false" json:"is_admin"`
	CreatedAt time.Time `json:"created_at"`
}

type FeeConfig struct {
	ID          string  `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	TxType      string  `gorm:"uniqueIndex;not null" json:"tx_type"`
	FeePercent  float64 `gorm:"default:0" json:"fee_percent"`
	FeeFlat     float64 `gorm:"default:0" json:"fee_flat"`
	FeeMin      float64 `gorm:"default:0" json:"fee_min"`
	FeeMax      float64 `gorm:"default:0" json:"fee_max"`
	FreeUpTo    float64 `gorm:"default:0" json:"free_up_to"` // no fee below this amount
}
