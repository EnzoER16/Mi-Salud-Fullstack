import { UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  ID,
  Mutation,
  Query,
  Resolver,
} from '@nestjs/graphql';

import {GqlPatientGuard} from './gql-patient.guard';
import type { GraphQLAuthRequest } from './gql-patient.guard';

import { GraphqlClinicalService } from './graphql-clinical.service';

import {
  VaccineObject,
  CreateVaccineInput,
  UpdateVaccineInput,
} from './types/vaccine.graphql';

@Resolver(() => VaccineObject)
@UseGuards(GqlPatientGuard)
export class VaccinesResolver {
  constructor(private readonly service: GraphqlClinicalService) {}

  @Query(() => [VaccineObject])
  vaccines(@Context('req') req: GraphQLAuthRequest) {
    return this.service.vaccines(req.user!.sub);
  }

  @Query(() => VaccineObject)
  vaccine(
    @Context('req') req: GraphQLAuthRequest,
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.service.vaccine(req.user!.sub, id);
  }

  @Mutation(() => VaccineObject)
  createVaccine(
    @Context('req') req: GraphQLAuthRequest,
    @Args('input') input: CreateVaccineInput,
  ) {
    return this.service.createVaccine(req.user!.sub, input);
  }

  @Mutation(() => VaccineObject)
  updateVaccine(
    @Context('req') req: GraphQLAuthRequest,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateVaccineInput,
  ) {
    return this.service.updateVaccine(req.user!.sub, id, input);
  }

  @Mutation(() => Boolean)
  deleteVaccine(
    @Context('req') req: GraphQLAuthRequest,
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.service.deleteVaccine(req.user!.sub, id);
  }
}