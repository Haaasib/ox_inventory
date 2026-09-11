if not lib then return end

local Items = require 'modules.items.server'
local Inventory = require 'modules.inventory.server'
local TriggerEventHooks = require 'modules.hooks.server'
local Shops = {}
local locations = shared.target and 'targets' or 'locations'

---@class OxShopItem
---@field slot number
---@field weight number

local function setupShopItems(id, shopType, shopName, groups)
	local shop = id and Shops[shopType][id] or Shops[shopType] --[[@as OxShop]]

	for i = 1, shop.slots do
		local slot = shop.items[i]

		if slot.grade and not groups then
			print(('^1attempted to restrict slot %s (%s) to grade %s, but %s has no job restriction^0'):format(id, slot.name, json.encode(slot.grade), shopName))
			slot.grade = nil
		end

		local Item = Items(slot.name)

		if Item then
			local category = slot.category
			---@type OxShopItem
			slot = {
				name = Item.name,
				slot = i,
				weight = Item.weight,
				count = slot.count,
				price = (server.randomprices and (not slot.currency or slot.currency == 'money')) and (math.ceil(slot.price * (math.random(80, 120)/100))) or slot.price or 0,
				metadata = slot.metadata,
				license = slot.license,
				currency = slot.currency,
				grade = slot.grade,
				category = category
			}

			if slot.metadata then
				slot.weight = Inventory.SlotWeight(Item, slot, true)
			end

			shop.items[i] = slot
		end
	end
end

---@param shopType string
---@param properties OxShop
local function registerShopType(shopType, properties)
	local shopLocations = properties[locations] or properties.locations

	if shopLocations then
		Shops[shopType] = properties
	else
		Shops[shopType] = {
			label = properties.name,
			id = shopType,
			groups = properties.groups or properties.jobs,
			items = properties.inventory,
			slots = #properties.inventory,
			type = 'shop',
			categories = properties.categories,
			tax = properties.tax ~= nil and properties.tax or server.shoptax,
			address = properties.address,
		}

		setupShopItems(nil, shopType, properties.name, properties.groups or properties.jobs)
	end
end

---@param shopType string
---@param id number
local function createShop(shopType, id)
	local shop = Shops[shopType]

	if not shop then return end

	local store = (shop[locations] or shop.locations)?[id]

	if not store then return end

	local groups = shop.groups or shop.jobs
    local coords

    if shared.target then
        if store.length then
            local z = store.loc.z + math.abs(store.minZ - store.maxZ) / 2
            coords = vec3(store.loc.x, store.loc.y, z)
        else
            coords = store.coords or store.loc
        end
    else
        coords = store
    end

	shop[id] = {
		label = shop.name,
		id = shopType..' '..id,
		groups = groups,
		items = table.clone(shop.inventory),
		slots = #shop.inventory,
		type = 'shop',
		coords = coords,
		distance = shared.target and shop.targets?[id]?.distance,
		categories = shop.categories,
		tax = shop.tax ~= nil and shop.tax or server.shoptax,
		address = (type(store) == 'table' and store.address) or (shop.addresses and shop.addresses[id]) or shop.address,
	}

	setupShopItems(id, shopType, shop.name, groups)

	return shop[id]
end

for shopType, shopDetails in pairs(lib.load('data.shops') or {}) do
	registerShopType(shopType, shopDetails)
end

---@param shopType string
---@param shopDetails OxShop
exports('RegisterShop', function(shopType, shopDetails)
	registerShopType(shopType, shopDetails)
end)

lib.callback.register('ox_inventory:openShop', function(source, data)
	local playerInv, shop = Inventory(source)

	if not playerInv then return end

	if data then
		shop = Shops[data.type]

		if not shop then return end

		if not shop.items then
			shop = (data.id and shop[data.id] or createShop(data.type, data.id))

			if not shop then return end
		end

		---@cast shop OxShop

		if shop.groups then
			local group = server.hasGroup(playerInv, shop.groups)
			if not group then return end
		end

		if type(shop.coords) == 'vector3' and #(GetEntityCoords(GetPlayerPed(source)) - shop.coords) > 10 then
			return
		end

		local shopType, shopId = shop.id:match('^(.-) (%d-)$')

        local hookPayload = {
            source = source,
            shopId = shopId,
			shopType = shopType,
            label = shop.label,
            slots = shop.slots,
            items = shop.items,
            groups = shop.groups,
            coords = shop.coords,
            distance = shop.distance
        }

        if not TriggerEventHooks('openShop', hookPayload) then return end

		---@diagnostic disable-next-line: assign-type-mismatch
		playerInv:openInventory(playerInv)
		playerInv.currentShop = shop.id
	end

	return { label = playerInv.label, type = playerInv.type, slots = playerInv.slots, weight = playerInv.weight, maxWeight = playerInv.maxWeight }, shop
end)

local function canAffordItem(inv, currency, price)
	local canAfford = price >= 0 and Inventory.GetItemCount(inv, currency) >= price

	return canAfford or {
		type = 'error',
		description = locale('cannot_afford', ('%s%s'):format((currency == 'money' and locale('$') or math.groupdigits(price)), (currency == 'money' and math.groupdigits(price) or ' '..Items(currency).label)))
	}
end

local function removeCurrency(inv, currency, price)
	Inventory.RemoveItem(inv, currency, price)
end

local function isRequiredGrade(grade, rank)
	if type(grade) == "table" then
		for i=1, #grade do
			if grade[i] == rank then
				return true
			end
		end
		return false
	else
		return rank >= grade
	end
end

lib.callback.register('ox_inventory:buyItem', function(source, data)
	if data.toType == 'player' then
		if data.count == nil then data.count = 1 end

		local playerInv = Inventory(source)

		if not playerInv or not playerInv.currentShop then return end

		local shopType, shopId = playerInv.currentShop:match('^(.-) (%d-)$')

		if not shopType then shopType = playerInv.currentShop end

		if shopId then shopId = tonumber(shopId) end

		local shop = shopId and Shops[shopType][shopId] or Shops[shopType]
		local fromData = shop.items[data.fromSlot]
		local toData = playerInv.items[data.toSlot]

		if fromData then
			if fromData.count then
				if fromData.count == 0 then
					return false, false, { type = 'error', description = locale('shop_nostock') }
				elseif data.count > fromData.count then
					data.count = fromData.count
				end
			end

			if fromData.license and server.hasLicense and not server.hasLicense(playerInv, fromData.license) then
				return false, false, { type = 'error', description = locale('item_unlicensed') }
			end

			if fromData.grade then
				local _, rank = server.hasGroup(playerInv, shop.groups)
				if not isRequiredGrade(fromData.grade, rank) then
					return false, false, { type = 'error', description = locale('stash_lowgrade') }
				end
			end

			local currency = fromData.currency or 'money'
			local fromItem = Items(fromData.name)

			local result = fromItem.cb and fromItem.cb('buying', fromItem, playerInv, data.fromSlot, shop)
			if result == false then return false end

			local toItem = toData and Items(toData.name)

			local metadata, count = Items.Metadata(playerInv, fromItem, fromData.metadata and table.clone(fromData.metadata) or {}, data.count)
			local price = count * fromData.price

			if toData == nil or (fromItem.name == toItem?.name and fromItem.stack and table.matches(toData.metadata, metadata)) then
				local newWeight = playerInv.weight + (fromItem.weight + (metadata?.weight or 0)) * count

				if newWeight > playerInv.maxWeight then
					return false, false, { type = 'error', description = locale('cannot_carry') }
				end

				local canAfford = canAffordItem(playerInv, currency, price)

				if canAfford ~= true then
					return false, false, canAfford
				end

				if not TriggerEventHooks('buyItem', {
					source = source,
					shopType = shopType,
					shopId = shopId,
					toInventory = playerInv.id,
					toSlot = data.toSlot,
					fromSlot = fromData,
					itemName = fromData.name,
					metadata = metadata,
					count = count,
					price = fromData.price,
					totalPrice = price,
					currency = currency,
				}) then return false end

				Inventory.SetSlot(playerInv, fromItem, count, metadata, data.toSlot)
				playerInv.weight = newWeight
				removeCurrency(playerInv, currency, price)

				if fromData.count then
					shop.items[data.fromSlot].count = fromData.count - count
				end

				if server.syncInventory then server.syncInventory(playerInv) end

				local message = locale('purchased_for', count, metadata?.label or fromItem.label, (currency == 'money' and locale('$') or math.groupdigits(price)), (currency == 'money' and math.groupdigits(price) or ' '..Items(currency).label))

				if server.loglevel > 0 then
					if server.loglevel > 1 or fromData.price >= 500 then
						lib.logger(playerInv.owner, 'buyItem', ('"%s" %s'):format(playerInv.label, message:lower()), ('shop:%s'):format(shop.label))
					end
				end

				return true, {data.toSlot, playerInv.items[data.toSlot], shop.items[data.fromSlot].count and shop.items[data.fromSlot], playerInv.weight}, { type = 'success', description = message }
			end

			return false, false, { type = 'error', description = locale('unable_stack_items') }
		end
	end
end)

lib.callback.register('ox_inventory:checkoutShop', function(source, data)
	local playerInv = Inventory(source)
	if not playerInv or not playerInv.currentShop then return false end
	if type(data) ~= 'table' or type(data.items) ~= 'table' or #data.items < 1 then return false end
	local payment = data.payment
	if payment ~= 'cash' and payment ~= 'card' and payment ~= 'giftcard' then
		payment = 'cash'
	end
	local shopType, shopId = playerInv.currentShop:match('^(.-) (%d-)$')
	if not shopType then shopType = playerInv.currentShop end
	if shopId then shopId = tonumber(shopId) end
	local shop = shopId and Shops[shopType][shopId] or Shops[shopType]
	if not shop then return false end
	local lines = {}
	local moneyTotal = 0
	local otherCosts = {}
	local addedWeight = 0
	for i = 1, #data.items do
		local entry = data.items[i]
		local fromData = shop.items[entry.fromSlot]
		if not fromData then
			return false, false, { type = 'error', description = locale('shop_nostock') }
		end
		local count = math.floor(tonumber(entry.count) or 1)
		if count < 1 then return false end
		if fromData.count then
			if fromData.count == 0 then
				return false, false, { type = 'error', description = locale('shop_nostock') }
			elseif count > fromData.count then
				count = fromData.count
			end
		end
		if fromData.license and server.hasLicense and not server.hasLicense(playerInv, fromData.license) then
			return false, false, { type = 'error', description = locale('item_unlicensed') }
		end
		if fromData.grade then
			local _, rank = server.hasGroup(playerInv, shop.groups)
			if not isRequiredGrade(fromData.grade, rank) then
				return false, false, { type = 'error', description = locale('stash_lowgrade') }
			end
		end
		local fromItem = Items(fromData.name)
		if not fromItem then return false end
		local result = fromItem.cb and fromItem.cb('buying', fromItem, playerInv, entry.fromSlot, shop)
		if result == false then return false end
		local metadata, metaCount = Items.Metadata(playerInv, fromItem, fromData.metadata and table.clone(fromData.metadata) or {}, count)
		local price = metaCount * fromData.price
		local currency = fromData.currency or 'money'
		lines[#lines + 1] = {
			fromData = fromData,
			fromItem = fromItem,
			count = metaCount,
			metadata = metadata,
			price = price,
			currency = currency,
			fromSlot = entry.fromSlot,
		}
		if currency == 'money' then
			moneyTotal += price
		else
			otherCosts[currency] = (otherCosts[currency] or 0) + price
		end
		addedWeight += (fromItem.weight + (metadata?.weight or 0)) * metaCount
	end
	if playerInv.weight + addedWeight > playerInv.maxWeight then
		return false, false, { type = 'error', description = locale('cannot_carry') }
	end
	local reserved = 0
	local seenStack = {}
	for i = 1, #lines do
		local line = lines[i]
		if line.fromItem.stack then
			local key = line.fromItem.name
			if not seenStack[key] then
				local slot = Inventory.GetSlotForItem(playerInv, line.fromItem.name, line.metadata)
				if not (slot and playerInv.items[slot]) then
					reserved += 1
				end
				seenStack[key] = true
			end
		else
			reserved += line.count
		end
	end
	local empty = 0
	for i = 1, playerInv.slots do
		if not playerInv.items[i] then empty += 1 end
	end
	if reserved > empty then
		return false, false, { type = 'error', description = locale('cannot_carry') }
	end
	local taxValue = shop.tax
	if taxValue == nil then taxValue = server.shoptax or 0 end
	local taxRate = taxValue / 100
	local taxed = math.ceil(moneyTotal * (1 + taxRate))
	if moneyTotal > 0 then
		if payment == 'card' then
			local bank = server.getAccountMoney(playerInv, 'bank')
			if bank == nil then
				local canAfford = canAffordItem(playerInv, 'money', taxed)
				if canAfford ~= true then return false, false, canAfford end
				payment = 'cash'
			elseif bank < taxed then
				return false, false, { type = 'error', description = locale('cannot_afford', ('%s%s'):format(locale('$'), math.groupdigits(taxed))) }
			end
		elseif payment == 'giftcard' then
			if not Items('giftcard') then
				return false, false, { type = 'error', description = locale('cannot_afford', 'Gift Card') }
			end
			local canAfford = canAffordItem(playerInv, 'giftcard', taxed)
			if canAfford ~= true then return false, false, canAfford end
		else
			local canAfford = canAffordItem(playerInv, 'money', taxed)
			if canAfford ~= true then return false, false, canAfford end
		end
	end
	for currency, amount in pairs(otherCosts) do
		local canAfford = canAffordItem(playerInv, currency, amount)
		if canAfford ~= true then return false, false, canAfford end
	end
	for i = 1, #lines do
		local line = lines[i]
		if not TriggerEventHooks('buyItem', {
			source = source,
			shopType = shopType,
			shopId = shopId,
			toInventory = playerInv.id,
			fromSlot = line.fromData,
			itemName = line.fromData.name,
			metadata = line.metadata,
			count = line.count,
			price = line.fromData.price,
			totalPrice = line.price,
			currency = line.currency,
			payment = payment,
		}) then return false end
	end
	local shopItems = {}
	for i = 1, #lines do
		local line = lines[i]
		local success = Inventory.AddItem(playerInv, line.fromItem.name, line.count, line.metadata)
		if not success then
			return false, false, { type = 'error', description = locale('cannot_carry') }
		end
		if line.fromData.count then
			shop.items[line.fromSlot].count = line.fromData.count - line.count
			shopItems[#shopItems + 1] = { item = shop.items[line.fromSlot], inventory = 'shop' }
		end
	end
	if moneyTotal > 0 then
		if payment == 'card' then
			if not server.removeAccountMoney(playerInv, 'bank', taxed, 'shop-purchase') then
				return false, false, { type = 'error', description = locale('cannot_afford', ('%s%s'):format(locale('$'), math.groupdigits(taxed))) }
			end
		elseif payment == 'giftcard' then
			removeCurrency(playerInv, 'giftcard', taxed)
		else
			removeCurrency(playerInv, 'money', taxed)
		end
	end
	for currency, amount in pairs(otherCosts) do
		removeCurrency(playerInv, currency, amount)
	end
	if server.syncInventory then server.syncInventory(playerInv) end
	local extra = 0
	local bought = 0
	for _, amount in pairs(otherCosts) do extra += amount end
	for i = 1, #lines do bought += lines[i].count end
	local message = locale('purchased_for', bought, 'items', locale('$'), math.groupdigits(taxed + extra))
	if server.loglevel > 0 then
		lib.logger(playerInv.owner, 'buyItem', ('"%s" %s'):format(playerInv.label, message:lower()), ('shop:%s'):format(shop.label))
	end
	return true, { shopItems = shopItems }, { type = 'success', description = message }
end)

server.shops = Shops
