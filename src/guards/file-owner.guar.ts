import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { FilesService } from "src/files/files.service";

@Injectable()
export class FileOwnerGuard implements CanActivate {
    constructor(private readonly filesService: FilesService) {

    }
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const { id: userId } = request.user;
        const { fileId } = request.params;

        if (!fileId) {
            throw new ForbiddenException("File ID is required");
        }

        const file = await this.filesService.checkFileOwnership(userId, fileId);
        if (!file) {
            throw new ForbiddenException("You are not the owner of this file");
        }

        return true;
    }
}
