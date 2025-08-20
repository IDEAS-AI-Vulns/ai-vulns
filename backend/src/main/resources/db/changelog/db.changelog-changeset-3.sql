--liquibase formatted sql

--changeset tomek:insert test users

-- Create roles
INSERT INTO users (username, password, api_key, reset_password)
VALUES ('user', '$2a$12$XJjJYh1oVX33kPiS/JShlebp8WjRSl4.FsW9R5hBWt2IWzAtpCyQi', null, true);