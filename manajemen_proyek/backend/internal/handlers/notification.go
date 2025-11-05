package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/unipro/project-management/internal/models"
	"github.com/unipro/project-management/pkg/database"
)

// GetNotifications returns all notifications for the logged-in user
func GetNotifications(c *gin.Context) {
	userID, _ := c.Get("userID")
	filter := c.Query("filter") // "unread", "read", "all"

	query := database.DB.Where("user_id = ?", userID)

	switch filter {
	case "unread":
		query = query.Where("is_read = ?", false)
	case "read":
		query = query.Where("is_read = ?", true)
	}

	var notifications []models.Notification
	if err := query.Order("created_at DESC").Find(&notifications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notifications"})
		return
	}

	c.JSON(http.StatusOK, notifications)
}

// GetUnreadCount returns the count of unread notifications
func GetUnreadCount(c *gin.Context) {
	userID, _ := c.Get("userID")

	var count int64
	if err := database.DB.Model(&models.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count notifications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"unread_count": count})
}

// MarkAsRead marks a specific notification as read
func MarkAsRead(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("userID")

	var notification models.Notification
	if err := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&notification).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}

	notification.IsRead = true
	if err := database.DB.Save(&notification).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update notification"})
		return
	}

	c.JSON(http.StatusOK, notification)
}

// MarkAllAsRead marks all notifications as read for the logged-in user
func MarkAllAsRead(c *gin.Context) {
	userID, _ := c.Get("userID")

	if err := database.DB.Model(&models.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Update("is_read", true).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update notifications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "All notifications marked as read"})
}

// DeleteNotification deletes a specific notification
func DeleteNotification(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("userID")

	result := database.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Notification{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete notification"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification deleted"})
}

