import { MRData } from "@/types";

export interface EDriverResponse {
  MRData: MRData & {
    DriverTable: {
      season: string;
      Drivers: EDriver[];
    };
  };
}

export interface EDriver {
  driverId: string;
  permanentNumber: string;
  code: string;
  url: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
}
