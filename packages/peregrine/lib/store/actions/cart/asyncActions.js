import BrowserPersistence from '../../../util/simplePersistence';
import { toggleDrawer } from '../app';
import actions from './actions';

const storage = new BrowserPersistence();

export const createCart = payload =>
    async function thunk(dispatch, getState) {
        const { fetchCartId } = payload;
        const { cart } = getState();

        // if a cart already exists in the store, exit
        if (cart.cartId) {
            return;
        }

        // Request a new cart.
        dispatch(actions.getCart.request());

        // if a cart exists in storage, act like we just received it
        const cartId = await retrieveCartId();
        if (cartId) {
            dispatch(actions.getCart.receive(cartId));
            return;
        }

        try {
            // errors can come from graphql and are not thrown
            const { data, errors } = await fetchCartId();

            let receivePayload;

            if (errors) {
                receivePayload = new Error(errors);
            } else {
                receivePayload = data.cartId;
                // write to storage in the background
                saveCartId(data.cartId);
            }

            dispatch(actions.getCart.receive(receivePayload));
        } catch (error) {
            dispatch(actions.getCart.receive(error));
        }
    };

export const addItemToCart = (payload = {}) => {
    const {
        addItemMutation,
        getCartDetailsQuery,
        fetchCartId,
        item,
        quantity,
        parentSku
    } = payload;

    const writingImageToCache = writeImageToCache(item);

    return async function thunk(dispatch, getState) {
        await writingImageToCache;
        dispatch(actions.addItem.request(payload));

        try {
            const { cart } = getState();
            const { cartId } = cart;

            const variables = {
                cartId,
                parentSku,
                product: item,
                quantity,
                sku: item.sku
            };

            await addItemMutation({
                variables,
                refetchQueries: [
                    {
                        query: getCartDetailsQuery,
                        variables: {
                            cartId
                        }
                    }
                ]
                //TODO: Optimistic UI stuff?
            });

            await dispatch(toggleDrawer('cart'));
            dispatch(actions.addItem.receive());
        } catch (error) {
            dispatch(actions.addItem.receive(error));

            const shouldRetry = !error.networkError && isInvalidCart(error);

            // Only retry if the cart is invalid or the cartId is missing.
            if (shouldRetry) {
                // Delete the cached ID from local storage and Redux.
                // In contrast to the save, make sure storage deletion is
                // complete before dispatching the error--you don't want an
                // upstream action to try and reuse the known-bad ID.
                await dispatch(removeCart());

                // then create a new one
                await dispatch(
                    createCart({
                        fetchCartId
                    })
                );

                // then retry this operation
                return thunk(...arguments);
            }
        }
    };
};

/**
 * Applies changes in options/quantity to a cart item.
 *
 * @param payload.cartItemId {Number} the id of the cart item we are updating
 * @param payload.item {Object} the new configuration item if changes are selected.
 * @param payload.quantity {Number} the quantity of the item being updated
 * @param payload.productType {String} 'ConfigurableProduct' or other.
 */
export const updateItemInCart = (payload = {}) => {
    const {
        cartItemId,
        getCartDetailsQuery,
        fetchCartId,
        item,
        productType,
        quantity,
        removeItem,
        updateItem
    } = payload;
    const writingImageToCache = writeImageToCache(item);

    return async function thunk(dispatch, getState) {
        await writingImageToCache;
        dispatch(actions.updateItem.request(payload));

        const { cart, user } = getState();
        const { cartId } = cart;
        const { isSignedIn } = user;

        try {
            if (productType === 'ConfigurableProduct') {
                // You _must_ remove before adding or risk deleting the item
                // entirely if only quantity has been modified.
                await dispatch(
                    removeItemFromCart({
                        item: {
                            id: cartItemId
                        },
                        fetchCartId,
                        getCartDetailsQuery,
                        removeItem
                    })
                );
                await dispatch(
                    addItemToCart({
                        ...payload
                    })
                );
            } else {
                // If the product is a simple product we can just use the
                // updateCartItems graphql mutation.
                await updateItem({
                    variables: {
                        cartId,
                        itemId: cartItemId,
                        quantity
                    },
                    refetchQueries: [
                        {
                            query: getCartDetailsQuery,
                            variables: {
                                cartId
                            }
                        }
                    ]
                });
            }

            dispatch(actions.updateItem.receive());
        } catch (error) {
            dispatch(actions.updateItem.receive(error));

            const shouldRetry = !error.networkError && isInvalidCart(error);
            if (shouldRetry) {
                // Delete the cached ID from local storage and Redux.
                // In contrast to the save, make sure storage deletion is
                // complete before dispatching the error--you don't want an
                // upstream action to try and reuse the known-bad ID.
                await dispatch(removeCart());

                // then create a new one
                await dispatch(
                    createCart({
                        fetchCartId
                    })
                );

                if (isSignedIn) {
                    // The user is signed in and we just received their cart.
                    // Retry this operation.
                    return thunk(...arguments);
                } else {
                    // The user is a guest and just received a brand new (empty) cart.
                    // Add the updated item to that cart.
                    await dispatch(
                        addItemToCart({
                            ...payload
                        })
                    );
                }
            }
        }
    };
};

export const removeItemFromCart = payload => {
    const { item, getCartDetailsQuery, fetchCartId, removeItem } = payload;

    return async function thunk(dispatch, getState) {
        dispatch(actions.removeItem.request(payload));

        const { cart } = getState();
        const { cartId } = cart;

        try {
            await removeItem({
                variables: {
                    cartId,
                    itemId: item.id
                },
                refetchQueries: [
                    {
                        query: getCartDetailsQuery,
                        variables: {
                            cartId
                        }
                    }
                ]
            });

            dispatch(actions.removeItem.receive());
        } catch (error) {
            dispatch(actions.removeItem.receive(error));

            const shouldResetCart = !error.networkError && isInvalidCart(error);
            if (shouldResetCart) {
                // Delete the cached ID from local storage.
                // The reducer handles clearing out the bad ID from Redux.
                // In contrast to the save, make sure storage deletion is
                // complete before dispatching the error--you don't want an
                // upstream action to try and reuse the known-bad ID.
                await dispatch(removeCart());
                // then create a new one
                await dispatch(
                    createCart({
                        fetchCartId
                    })
                );
            }
        }
    };
};

export const removeCart = () =>
    async function thunk(dispatch) {
        // Clear the cartId from local storage.
        await clearCartId();

        // Clear the cart info from the redux store.
        dispatch(actions.reset());
    };

/* helpers */
export async function retrieveCartId() {
    return storage.getItem('cartId');
}

export async function saveCartId(id) {
    return storage.setItem('cartId', id);
}

export async function clearCartId() {
    return storage.removeItem('cartId');
}

async function retrieveImageCache() {
    return storage.getItem('imagesBySku') || {};
}

async function saveImageCache(cache) {
    return storage.setItem('imagesBySku', cache);
}

export async function writeImageToCache(item = {}) {
    const { media_gallery_entries: media, sku } = item;

    if (sku) {
        const image = media && (media.find(m => m.position === 1) || media[0]);

        if (image) {
            const imageCache = await retrieveImageCache();

            // if there is an image and it differs from cache
            // write to cache and save in the background
            if (imageCache[sku] !== image) {
                imageCache[sku] = image;
                saveImageCache(imageCache);

                return image;
            }
        }
    }
}

// Returns true if the cart is invalid.
function isInvalidCart(error) {
    return !!(
        error.graphQLErrors &&
        error.graphQLErrors.find(err =>
            err.message.includes('Could not find a cart')
        )
    );
}
