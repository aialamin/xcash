package models

import "time"

type LoginHistory struct {
	ID        string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	UserID    string    `gorm:"type:uuid;index" json:"user_id"`
	DeviceID  string    `json:"device_id"`
	IPAddress string    `json:"ip_address"`
	Status    string    `json:"status"` // success, failed
	CreatedAt time.Time `json:"created_at"`
}

type PaymentLink struct {
	ID          string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	UserID      string    `gorm:"type:uuid;index" json:"user_id"`
	Code        string    `gorm:"uniqueIndex" json:"code"`
	Amount      float64   `json:"amount"`       // 0 = any amount
	Description string    `json:"description"`
	Uses        int       `gorm:"default:0" json:"uses"`
	MaxUses     int       `gorm:"default:0" json:"max_uses"` // 0 = unlimited
	Active      bool      `gorm:"default:true" json:"active"`
	CreatedAt   time.Time `json:"created_at"`
	User        *User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

type Referral struct {
	ID         string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	ReferrerID string    `gorm:"type:uuid;index" json:"referrer_id"`
	ReferredID string    `gorm:"type:uuid;index" json:"referred_id"`
	Code       string    `gorm:"index" json:"code"`
	Rewarded   bool      `gorm:"default:false" json:"rewarded"`
	CreatedAt  time.Time `json:"created_at"`
}
