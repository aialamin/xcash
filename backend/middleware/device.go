package middleware

import (
	"context"
	"fmt"
	"xcash/backend/database"
	"xcash/backend/models"

	"gorm.io/gorm"
)

// CheckDevice detects new device logins and alerts the user
func CheckAndRegisterDevice(db *gorm.DB, user *models.User, deviceID string) bool {
	if deviceID == "" {
		return false // no device ID sent — treat as known
	}
	isNew := false
	if user.DeviceID == "" {
		// First device registration
		db.Model(user).Update("device_id", deviceID)
	} else if user.DeviceID != deviceID {
		isNew = true
	}
	return isNew
}

// StoreDeviceAlert publishes a new-device notification via Redis pub flag
func StoreDeviceAlert(userID, deviceID string) {
	if database.RDB == nil {
		return
	}
	ctx := context.Background()
	key := fmt.Sprintf("new_device_alert:%s", userID)
	database.RDB.Set(ctx, key, deviceID, 0) // persists until cleared
}
