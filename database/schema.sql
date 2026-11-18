CREATE DATABASE IF NOT EXISTS medibook;
USE medibook;

DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS patients;

CREATE TABLE patients (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name  VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  phone      VARCHAR(20)  NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE doctors (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name        VARCHAR(100)  NOT NULL,
  specialty        VARCHAR(100)  NOT NULL,
  consultation_fee DECIMAL(8, 2) NOT NULL,
  room             VARCHAR(10)   NOT NULL,
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_consultation_fee CHECK (consultation_fee >= 0)
);

CREATE TABLE appointments (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id    INT UNSIGNED  NOT NULL,
  doctor_id     INT UNSIGNED  NOT NULL,
  appt_datetime DATETIME      NOT NULL,
  amount_paid   DECIMAL(8, 2) NOT NULL,
  status        ENUM('booked', 'cancelled') NOT NULL DEFAULT 'booked',
  booked_on     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cancelled_at  DATETIME      NULL,
  refund_amount DECIMAL(8, 2) NULL,
  active_slot   DATETIME AS (IF(status = 'booked', appt_datetime, NULL)) STORED,

  CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id)
    REFERENCES patients (id) ON DELETE RESTRICT,
  CONSTRAINT fk_appointments_doctor FOREIGN KEY (doctor_id)
    REFERENCES doctors (id) ON DELETE RESTRICT,

  CONSTRAINT uq_doctor_active_slot UNIQUE (doctor_id, active_slot),

  CONSTRAINT chk_slot_boundary CHECK (MINUTE(appt_datetime) IN (0, 30) AND SECOND(appt_datetime) = 0),
  CONSTRAINT chk_working_hours CHECK (HOUR(appt_datetime) BETWEEN 9 AND 16),
  CONSTRAINT chk_amount_paid CHECK (amount_paid >= 0),
  CONSTRAINT chk_refund_amount CHECK (refund_amount IS NULL OR (refund_amount >= 0 AND refund_amount <= amount_paid)),
  CONSTRAINT chk_cancellation_fields CHECK (
    (status = 'booked' AND cancelled_at IS NULL AND refund_amount IS NULL)
    OR (status = 'cancelled' AND cancelled_at IS NOT NULL AND refund_amount IS NOT NULL)
  )
);
