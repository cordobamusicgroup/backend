import { Controller, Get, UseGuards } from '@nestjs/common';
import { CountriesService } from './countries.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllCountries() {
    return this.countriesService.getAllCountries();
  }
}
