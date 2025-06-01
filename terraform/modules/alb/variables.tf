variable "project" {
  description = "Project name"
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

variable "container_port" {
  description = "Port on which the container will receive traffic"
  type        = number
}

variable "certificate_arn" {
  description = "ARN of ACM certificate"
  type        = string
}
