package controllers

import (
	"fmt"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type WebhookController struct {
	clerkHandler  *ClerkWebhookHandler
	stripeHandler *StripeWebhookHandler
}

func NewWebhookController(db *gorm.DB) *WebhookController {
	return &WebhookController{
		clerkHandler:  NewClerkWebhookHandler(db),
		stripeHandler: NewStripeWebhookHandler(db),
	}
}

func (c *WebhookController) HandleWebhook(ctx *gin.Context) {
	provider := ctx.Param("provider")
	fmt.Println("provider", provider)

	switch provider {
	case "clerk":
		fmt.Println("clerk webhook received")
		c.clerkHandler.Handle(ctx)
	case "stripe":
		fmt.Println("stripe webhook received")
		c.stripeHandler.Handle(ctx)
	default:
		ctx.JSON(400, gin.H{"error": "Unknown webhook provider"})
	}
}
