import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/presentation/security/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { GetMe } from '@/common/decorators/get-me.decorator';
import { UserRole } from '@/common/enums/user-role.enum';
import { ApiResponse } from '@/common/dtos/api-response';

import { CreateCompanyUseCase } from '@/modules/company/application/use-cases/create-company.use-case';
import { UpdateCompanyUseCase } from '@/modules/company/application/use-cases/update-company.use-case';
import { GetCompanyUseCase } from '@/modules/company/application/use-cases/get-company.use-case';
import { ListCompaniesUseCase } from '@/modules/company/application/use-cases/list-companies.use-case';
import { DeleteCompanyUseCase } from '@/modules/company/application/use-cases/delete-company.use-case';

import { CreateCompanyDto } from '@/modules/company/presentation/dtos/create-company.dto';
import { UpdateCompanyDto } from '@/modules/company/presentation/dtos/update-company.dto';
import { SearchCompanyDto } from '@/modules/company/presentation/dtos/search-company.dto';

@ApiTags('companies')
@Controller('companies')
export class CompanyController {
  constructor(
    private readonly createCompanyUseCase: CreateCompanyUseCase,
    private readonly updateCompanyUseCase: UpdateCompanyUseCase,
    private readonly getCompanyUseCase: GetCompanyUseCase,
    private readonly listCompaniesUseCase: ListCompaniesUseCase,
    private readonly deleteCompanyUseCase: DeleteCompanyUseCase,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER)
  @ApiOperation({ summary: 'Create my company (Recruiter only, 1 per recruiter)' })
  async create(@GetMe('id') recruiterId: string, @Body() dto: CreateCompanyDto) {
    const result = await this.createCompanyUseCase.execute(recruiterId, dto);
    return ApiResponse.ok(result, 'Company created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'List and search companies' })
  async list(@Query() query: SearchCompanyDto) {
    const result = await this.listCompaniesUseCase.execute({
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      keyword: query.keyword,
      industry: query.industry,
    });
    return ApiResponse.ok(result.companies, 'Companies retrieved successfully', {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company by ID (with its open jobs)' })
  async getById(@Param('id') id: string) {
    const result = await this.getCompanyUseCase.execute(id);
    return ApiResponse.ok(result, 'Company retrieved successfully');
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER)
  @ApiOperation({ summary: 'Update company (Owner only)' })
  async update(
    @GetMe('id') recruiterId: string,
    @Param('id') companyId: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    const result = await this.updateCompanyUseCase.execute(recruiterId, companyId, dto);
    return ApiResponse.ok(result, 'Company updated successfully');
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete company (Owner only, soft delete)' })
  async delete(@GetMe('id') recruiterId: string, @Param('id') companyId: string) {
    await this.deleteCompanyUseCase.execute(recruiterId, companyId);
  }
}
