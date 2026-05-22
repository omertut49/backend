import { PartialType } from '@nestjs/mapped-types';
import { CreateBugReportDto } from './create-bug-report.dto';

export class UpdateBugReportDto extends PartialType(CreateBugReportDto) {}
