import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  password: string;
  avatar: string;
  watchlist: Array<{
    mediaId: number;
    mediaType: 'movie' | 'tv';
    title: string;
    poster: string;
    addedAt: Date;
  }>;
  createdAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const WatchlistItemSchema = new Schema({
  mediaId:   { type: Number, required: true },
  mediaType: { type: String, enum: ['movie', 'tv'], required: true },
  title:     { type: String, required: true },
  poster:    { type: String, default: '' },
  addedAt:   { type: Date,   default: Date.now },
}, { _id: false });

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  avatar:   { type: String, default: '' },
  watchlist:{ type: [WatchlistItemSchema], default: [] },
}, { timestamps: true });

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
