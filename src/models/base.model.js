export class BaseModel {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    const doc = new this.model(data);
    return doc.save();
  }

  async findById(id) {
    return this.model.findById(id);
  }

  async findOne(query) {
    return this.model.findOne(query);
  }

  async find(query = {}, options = {}) {
    const { sort, limit, skip, select } = options;
    let queryBuilder = this.model.find(query);

    if (sort) queryBuilder = queryBuilder.sort(sort);
    if (limit) queryBuilder = queryBuilder.limit(limit);
    if (skip) queryBuilder = queryBuilder.skip(skip);
    if (select) queryBuilder = queryBuilder.select(select);

    return queryBuilder.exec();
  }

  async findByIdAndUpdate(id, update, options = { new: true }) {
    return this.model.findByIdAndUpdate(id, update, options);
  }

  async findOneAndUpdate(query, update, options = { new: true }) {
    return this.model.findOneAndUpdate(query, update, options);
  }

  async updateOne(query, update) {
    return this.model.updateOne(query, update);
  }

  async updateMany(query, update) {
    return this.model.updateMany(query, update);
  }

  async findByIdAndDelete(id) {
    return this.model.findByIdAndDelete(id);
  }

  async findOneAndDelete(query) {
    return this.model.findOneAndDelete(query);
  }

  async deleteOne(query) {
    return this.model.deleteOne(query);
  }

  async deleteMany(query) {
    return this.model.deleteMany(query);
  }

  async count(query = {}) {
    return this.model.countDocuments(query);
  }

  async exists(query) {
    return this.model.exists(query);
  }

  async aggregate(pipeline) {
    return this.model.aggregate(pipeline);
  }
}

export default BaseModel;
