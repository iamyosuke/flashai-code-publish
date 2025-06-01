# SSM Parameter Store for environment variables

resource "aws_ssm_parameter" "clerk_secret_key" {
  name      = "/${var.project}/${var.environment}/CLERK_SECRET_KEY"
  type      = "SecureString"
  value     = var.clerk_secret_key
  overwrite = true

  tags = {
    Name = "${var.project}-clerk-secret-key"
  }
}

resource "aws_ssm_parameter" "clerk_webhook_secret" {
  name      = "/${var.project}/${var.environment}/CLERK_WEBHOOK_SECRET"
  type      = "SecureString"
  value     = var.clerk_webhook_secret
  overwrite = true

  tags = {
    Name = "${var.project}-clerk-webhook-secret"
  }
}

resource "aws_ssm_parameter" "database_url" {
  name      = "/${var.project}/${var.environment}/DATABASE_URL"
  type      = "SecureString"
  value     = var.database_url
  overwrite = true

  tags = {
    Name = "${var.project}-database-url"
  }
}

resource "aws_ssm_parameter" "gemini_api_key" {
  name      = "/${var.project}/${var.environment}/GEMINI_API_KEY"
  type      = "SecureString"
  value     = var.gemini_api_key
  overwrite = true

  tags = {
    Name = "${var.project}-gemini-api-key"
  }
}

resource "aws_ssm_parameter" "stripe_secret_key" {
  name      = "/${var.project}/${var.environment}/STRIPE_SECRET_KEY"
  type      = "SecureString"
  value     = var.stripe_secret_key
  overwrite = true

  tags = {
    Name = "${var.project}-stripe-secret-key"
  }
}

resource "aws_ssm_parameter" "stripe_publishable_key" {
  name      = "/${var.project}/${var.environment}/STRIPE_PUBLISHABLE_KEY"
  type      = "String"
  value     = var.stripe_publishable_key
  overwrite = true

  tags = {
    Name = "${var.project}-stripe-publishable-key"
  }
}

resource "aws_ssm_parameter" "stripe_webhook_secret" {
  name      = "/${var.project}/${var.environment}/STRIPE_WEBHOOK_SECRET"
  type      = "SecureString"
  value     = var.stripe_webhook_secret
  overwrite = true

  tags = {
    Name = "${var.project}-stripe-webhook-secret"
  }
}
