CREATE TYPE "public"."order_status" AS ENUM('pending', 'processing', 'paid', 'failed');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('wallet', 'stripe', 'paypal');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"price_at_purchase" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"provider" "payment_provider" NOT NULL,
	"amount" numeric(16, 3) NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"external_transaction_id" varchar(255),
	"error_message" text,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_attempts_external_transaction_id_unique" UNIQUE("external_transaction_id")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"idempotency_key" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"balance" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"reservations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallets_customer_id_unique" UNIQUE("customer_id")
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_orders_customer" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_payment_attempts_payment" ON "payment_attempts" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "idx_payments_order" ON "payments" USING btree ("order_id");