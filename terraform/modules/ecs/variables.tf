variable "project" {
  description = "Project name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs"
  type        = list(string)
}

variable "alb_security_group_id" {
  description = "Security group ID for the ALB"
  type        = string
}

variable "target_group_arn" {
  description = "ARN of the target group"
  type        = string
}

variable "container_port" {
  description = "Port on which the container will receive traffic"
  type        = number
}

variable "container_cpu" {
  description = "CPU units for the container"
  type        = number
}

variable "container_memory" {
  description = "Memory for the container in MiB"
  type        = number
}

variable "desired_count" {
  description = "Number of tasks to run"
  type        = number
}

variable "ecr_repository_url" {
  description = "URL of the ECR repository"
  type        = string
}

variable "clerk_secret_key" {
  description = "Clerk API secret key"
  type        = string
  sensitive   = true
}

variable "clerk_webhook_secret" {
  description = "Clerk webhook secret"
  type        = string
  sensitive   = true
}

variable "database_url" {
  description = "Database connection URL"
  type        = string
  sensitive   = true
  default     = "postgresql://temp:temp@temp:5432/temp"
}
