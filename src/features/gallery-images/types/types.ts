export interface SerializedGalleryImage {
  _id: string;
  url: string;
  publicId?: string;
  altText: string;
  caption?: string;
  order: number;
  isActive: boolean;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}
