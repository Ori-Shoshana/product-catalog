import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'products' })
export class ProductEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  public id!: number;

  @Column({ name: 'name', type: 'text' })
  public name!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  public description!: string | null;

  @Column({
    name: 'bounding_polygon',
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
  })
  public boundingPolygon!: unknown;

  @Column({ name: 'consumption_link', type: 'text', nullable: true })
  public consumptionLink!: string | null;

  @Column({ name: 'type', type: 'text' })
  public type!: string;

  @Column({ name: 'consumption_protocol', type: 'text' })
  public consumptionProtocol!: string;

  @Column({ name: 'resolution_best', type: 'double precision', nullable: true })
  public resolutionBest!: number | null;

  @Column({ name: 'min_zoom', type: 'int', nullable: true })
  public minZoom!: number | null;

  @Column({ name: 'max_zoom', type: 'int', nullable: true })
  public maxZoom!: number | null;
}
