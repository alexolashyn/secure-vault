import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "../users/user.entity";

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.files, { onDelete: "CASCADE" })
  owner: User;
}
