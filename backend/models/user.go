package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID        string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	Name      string    `gorm:"not null" json:"name"`
	Phone     string    `gorm:"uniqueIndex;not null" json:"phone"`
	Email     string    `json:"email,omitempty"`
	NID       string    `json:"nid,omitempty"`
	Pin       string    `gorm:"not null" json:"-"`
	Role      string    `gorm:"default:'user'" json:"role"`
	Status    string    `gorm:"default:'active'" json:"status"`
	KYCStatus  string    `gorm:"column:kyc_status;default:'pending'" json:"kyc_status"`
	DeviceID   string    `json:"device_id,omitempty"`
	DailyLimit float64   `gorm:"default:25000" json:"daily_limit"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func (u *User) HashPin(pin string) error {
	b, err := bcrypt.GenerateFromPassword([]byte(pin), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Pin = string(b)
	return nil
}

func (u *User) CheckPin(pin string) bool {
	return bcrypt.CompareHashAndPassword([]byte(u.Pin), []byte(pin)) == nil
}
