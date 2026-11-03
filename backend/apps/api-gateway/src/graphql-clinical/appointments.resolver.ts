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
  AppointmentObject,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from './types/appointment.graphql';

@Resolver(() => AppointmentObject)
@UseGuards(GqlPatientGuard)
export class AppointmentsResolver {
  constructor(private readonly service: GraphqlClinicalService) {}

  @Query(() => [AppointmentObject])
  appointments(@Context('req') req: GraphQLAuthRequest) {
    return this.service.appointments(req.user!.sub);
  }

  @Query(() => AppointmentObject)
  appointment(
    @Context('req') req: GraphQLAuthRequest,
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.service.appointment(req.user!.sub, id);
  }

  @Mutation(() => AppointmentObject)
  createAppointment(
    @Context('req') req: GraphQLAuthRequest,
    @Args('input') input: CreateAppointmentInput,
  ) {
    return this.service.createAppointment(req.user!.sub, input);
  }

  @Mutation(() => AppointmentObject)
  updateAppointment(
    @Context('req') req: GraphQLAuthRequest,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateAppointmentInput,
  ) {
    return this.service.updateAppointment(req.user!.sub, id, input);
  }

  @Mutation(() => Boolean)
  deleteAppointment(
    @Context('req') req: GraphQLAuthRequest,
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.service.deleteAppointment(req.user!.sub, id);
  }
}