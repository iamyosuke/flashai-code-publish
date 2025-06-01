terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "ai-flashcards-tfstate"
    key            = "terraform.tfstate"
    region         = "ap-northeast-1"
    dynamodb_table = "ai-flashcards-tfstate-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = "ap-northeast-1"

  default_tags {
    tags = {
      Project     = "ai-flashcards"
      Environment = "production"
      Terraform   = "true"
    }
  }
}
