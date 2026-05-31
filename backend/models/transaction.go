package models

import "time"

type Transaction struct {
	ID         string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	SenderID   string    `gorm:"type:uuid;index" json:"sender_id,omitempty"`
	ReceiverID string    `gorm:"type:uuid;index" json:"receiver_id,omitempty"`
	Type       string    `gorm:"not null;index" json:"type"`
	Amount     float64   `gorm:"not null" json:"amount"`
	Fee        float64   `gorm:"default:0" json:"fee"`
	Status     string    `gorm:"default:'success'" json:"status"`
	Ref        string    `gorm:"uniqueIndex" json:"ref"`
	Note       string    `json:"note,omitempty"`
	Metadata   string    `gorm:"type:jsonb;default:'{}'" json:"metadata,omitempty"`
	Disputed   bool      `gorm:"default:false" json:"disputed"`
	FraudScore int       `gorm:"default:0" json:"fraud_score,omitempty"`
	CreatedAt  time.Time `gorm:"index" json:"created_at"`

	Sender   *User `gorm:"foreignKey:SenderID" json:"sender,omitempty"`
	Receiver *User `gorm:"foreignKey:ReceiverID" json:"receiver,omitempty"`
}
