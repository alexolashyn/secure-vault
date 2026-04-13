import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { FileEntity } from "../files/file.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ type: "text" })
  publicKey: string;

  @Column({ type: "text" })
  encryptedPrivateKey: string;

  @Column()
  kdfSalt: string;

  @Column()
  iv: string;

  @OneToMany(() => FileEntity, (file) => file.owner)
  files: FileEntity[];
}
