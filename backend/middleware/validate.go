package middleware

import (
	"regexp"
	"strings"
)

var (
	phoneRegex = regexp.MustCompile(`^01[3-9]\d{8}$`)
	weakPINs   = []string{
		"000000","111111","222222","333333","444444",
		"555555","666666","777777","888888","999999",
		"123456","654321","012345","098765",
	}
)

const (
	MaxTransactionAmount = 25000.0  // ৳25,000 per transaction
	MaxAddMoneyAmount    = 50000.0  // ৳50,000 per add-money
	MinTransactionAmount = 10.0
)

func ValidatePhone(phone string) bool {
	return phoneRegex.MatchString(phone)
}

func ValidatePIN(pin string) (bool, string) {
	if len(pin) != 6 {
		return false, "PIN must be exactly 6 digits"
	}
	for _, c := range pin {
		if c < '0' || c > '9' {
			return false, "PIN must contain only digits"
		}
	}
	for _, weak := range weakPINs {
		if pin == weak {
			return false, "PIN is too weak. Avoid sequential or repeated digits"
		}
	}
	return true, ""
}

func ValidateAmount(amount, min, max float64) (bool, string) {
	if amount < min {
		return false, "Amount is below minimum"
	}
	if amount > max {
		return false, "Amount exceeds maximum limit"
	}
	return true, ""
}

func SanitizeString(s string) string {
	return strings.TrimSpace(s)
}
