import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "../users/user.entity";

export enum FILE_STATUS {
  PENDING = "pending",
  SUCCESS = "success",
  FAILED = "failed",
}

@Entity("files")
export class FileEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column()
  minioPath: string;

  @Column({ type: "text" })
  encryptedFileKey: string;

  @Column({ type: "text" })
  fileIv: string;

  @Column({ nullable: true })
  mimeType: string;

  @Column({ type: "bigint", default: 0 })
  size: number;

  @Column({ type: "enum", enum: FILE_STATUS, default: FILE_STATUS.PENDING })
  status: FILE_STATUS;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.files, { onDelete: "CASCADE" })
  owner: User;
}
