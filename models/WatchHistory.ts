import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWatchHistory extends Document {
  userId:    mongoose.Types.ObjectId | null; // null = misafir (guestId ile)
  guestId:   string | null;
  mediaId:   number;
  mediaType: 'movie' | 'tv';
  title:     string;
  poster:    string;
  season:    number;
  episode:   number;
  progress:  number;   // 0-100 yüzde
  duration:  number;   // saniye
  updatedAt: Date;
}

const WatchHistorySchema = new Schema<IWatchHistory>({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', default: null },
  guestId:   { type: String, default: null },
  mediaId:   { type: Number, required: true },
  mediaType: { type: String, enum: ['movie', 'tv'], required: true },
  title:     { type: String, required: true },
  poster:    { type: String, default: '' },
  season:    { type: Number, default: 1 },
  episode:   { type: Number, default: 1 },
  progress:  { type: Number, default: 0 },
  duration:  { type: Number, default: 0 },
  updatedAt: { type: Date,   default: Date.now },
});

// Her kullanıcı başına her içerik için tek kayıt
WatchHistorySchema.index({ userId: 1, mediaId: 1, mediaType: 1 }, { unique: false });
WatchHistorySchema.index({ guestId: 1, mediaId: 1, mediaType: 1 }, { unique: false });

const WatchHistory: Model<IWatchHistory> =
  mongoose.models.WatchHistory ||
  mongoose.model<IWatchHistory>('WatchHistory', WatchHistorySchema);

export default WatchHistory;
