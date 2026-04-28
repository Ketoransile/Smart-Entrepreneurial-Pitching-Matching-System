const { Op } = require("sequelize");
const _Sequelize = require("../db/sequelize"); // Assume Sequelize instance is configured
const Product = require("../models/Products");
const Service = require("../models/Service");
const _ProductOrder = require("../models/ProductOrder"); // Represents the "Product_Orders" table
const _OrderDetail = require("../models/ProductOrderDetail");
const Semester = require("../models/Semester");
const _ProductCategoriesRelation = require("../models/ProductCategoriesRelation");
const _Category = require("../models/Catagories");
const Promotions = require("../models/Promotions");
const ProductDiscount = require("../models/ProductDiscount");

const _ServiceOrder = require("../models/ServiceOrder");

class PaymentServices {
	async calculateTotalProductPrice(items, promotionId = null) {
		try {
			if (!Array.isArray(items) || items.length === 0) {
				return 0;
			}

			const productIds = items.map((item) => item.product_id);

			const products = await Product.findAll({
				where: {
					id: productIds,
					is_active: true,
				},
			});

			if (products.length !== items.length) {
				const foundProductIds = products.map((p) => p.id);
				const notFoundProducts = items
					.filter((item) => !foundProductIds.includes(item.product_id))
					.map((item) => item.product_id);

				throw new Error(
					`Products with IDs [${notFoundProducts.join(
						", ",
					)}] not found or inactive.`,
				);
			}

			// Load active promotion if not passed
			let activePromotion = null;
			if (!promotionId) {
				activePromotion = await Promotions.findOne({
					where: {
						start_time: { [Op.lte]: new Date() },
						end_time: { [Op.gte]: new Date() },
						deleted_at: null,
					},
					order: [["created_at", "DESC"]],
				});
				promotionId = activePromotion?.id || null;
			}

			const discountMap = new Map();
			if (promotionId) {
				const discounts = await ProductDiscount.findAll({
					where: {
						promotion_id: promotionId,
						product_id: productIds,
						deleted_at: null,
					},
				});

				discounts.forEach((discount) => {
					discountMap.set(discount.product_id, {
						mode: discount.discount_mode,
						value: parseFloat(discount.discount_value),
					});
				});
			}

			let _total_price = 0;
			let total_discounted_price = 0;
			const itemBreakdown = [];

			for (const item of items) {
				const product = products.find((p) => p.id === item.product_id);
				if (!product) continue;

				const price = parseFloat(product.price);
				let discountedPrice = price;

				if (discountMap.has(product.id)) {
					const discount = discountMap.get(product.id);
					if (discount.mode === "fixed") {
						discountedPrice = Math.max(0, price - discount.value);
					} else if (discount.mode === "percentage") {
						discountedPrice = price * (1 - discount.value / 100);
					}
				}

				const quantity = item.quantity;
				const subtotal = price * quantity;
				const discountedSubtotal = discountedPrice * quantity;

				_total_price += subtotal;
				total_discounted_price += discountedSubtotal;

				itemBreakdown.push({
					product_id: product.id,
					quantity,
					unit_price: price,
					discounted_unit_price: discountedPrice,
					subtotal,
					discounted_subtotal: discountedSubtotal,
				});
			}

			return total_discounted_price;
		} catch (error) {
			console.error("Error in calculateTotalPrice:", error);
			return null; // or throw if you want to handle it outside
		}
	}
	async calculateServicePrice(service_id) {
		try {
			const service = await Service.findOne({
				where: {
					id: service_id,
					is_active: true,
				},
			});

			if (!service) {
				throw new Error(`Service with ID ${service_id} not found or inactive.`);
			}

			const price = parseFloat(service.price);

			return {
				service_id: service.id,
				service_name: service.name,
				price: price,
			};
		} catch (error) {
			console.error("Error calculating service price:", error);
			return null; // or throw if you'd prefer the caller to handle it
		}
	}
	async calculateSemesterFee(semester_id) {
		try {
			const semester = await Semester.findOne({
				where: {
					id: semester_id,
					is_current: true,
				},
			});

			if (!semester) {
				throw new Error(
					`Service with ID ${semester_id} not found or inactive.`,
				);
			}

			const price = parseFloat(semester.price);

			return {
				semester_id: semester.id,
				service_name: semester.name,
				price: price,
			};
		} catch (error) {
			console.error("Error calculating semester price:", error);
			return null; // or throw if you'd prefer the caller to handle it
		}
	}
	async arrange_payment({ type, data }) {
		if (!type || !data) {
			throw new Error("Missing required fields: type, data ");
		}

		let priceResult;
		let meta_data = {};
		// Removed unused variable promotionId

		switch (type) {
			case "product":
				if (!Array.isArray(data)) {
					throw new Error(
						"For product payments, data must be an array of {product_id, quantity}.",
					);
				}

				priceResult = await this.calculateTotalProductPrice(data);

				if (!priceResult)
					throw new Error("Failed to calculate product prices.");

				meta_data = {
					data: data,
					amount: priceResult,
					type: "product",
				};

				break;

			case "service":
				// console.log("priceResult");
				priceResult = await this.calculateServicePrice(data[0].service_id);
				if (!priceResult) throw new Error("Failed to calculate service price.");

				meta_data = {
					data: data,
					amount: priceResult.price,
					type: "service",
				};
				break;

			case "registration":
				priceResult = await this.calculateSemesterFee(data[0].semesterId);
				if (!priceResult) throw new Error("Failed to calculate semester fee.");

				meta_data = {
					data: data,
					amount: priceResult.price,
				};
				break;

			default:
				throw new Error("Invalid payment type.");
		}

		return {
			success: true,
			type,
			amount: meta_data.amount,
			details: meta_data.data,
		};
	}
}

module.exports = new PaymentServices();
