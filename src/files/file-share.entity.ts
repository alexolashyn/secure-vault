import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Column,
} from "typeorm";
import { User } from "../users/user.entity";
import { FileEntity } from "./file.entity";
@Entity("file_shares")
export class FileShare {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  expiresAt: Date;

  @Column()
  encryptedFileKey: string;

  @ManyToOne(() => FileEntity, { onDelete: "CASCADE" })
  file: FileEntity;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  user: User;

  @ManyToOne(() => User)
  sharedBy: User;
}
