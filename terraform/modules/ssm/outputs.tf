output "parameter_arns" {
  description = "ARNs of all SSM parameters"
  value = {
    clerk_secret_key      = aws_ssm_parameter.clerk_secret_key.arn
    clerk_webhook_secret  = aws_ssm_parameter.clerk_webhook_secret.arn
    database_url          = aws_ssm_parameter.database_url.arn
    gemini_api_key        = aws_ssm_parameter.gemini_api_key.arn
    stripe_secret_key     = aws_ssm_parameter.stripe_secret_key.arn
    stripe_publishable_key = aws_ssm_parameter.stripe_publishable_key.arn
    stripe_webhook_secret = aws_ssm_parameter.stripe_webhook_secret.arn
  }
}

output "parameter_names" {
  description = "Names of all SSM parameters"
  value = {
    clerk_secret_key      = aws_ssm_parameter.clerk_secret_key.name
    clerk_webhook_secret  = aws_ssm_parameter.clerk_webhook_secret.name
    database_url          = aws_ssm_parameter.database_url.name
    gemini_api_key        = aws_ssm_parameter.gemini_api_key.name
    stripe_secret_key     = aws_ssm_parameter.stripe_secret_key.name
    stripe_publishable_key = aws_ssm_parameter.stripe_publishable_key.name
    stripe_webhook_secret = aws_ssm_parameter.stripe_webhook_secret.name
  }
}
