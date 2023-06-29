/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    startAfter,
} from 'firebase/firestore'
import { db } from '../firebase.config'

import { toast } from 'react-toastify'
import Spinner from '../components/Spinner'
import ListingItem from '../components/ListingItem'

function Category() 
{
    const [listings, setListings] = useState([])
    const [loading, setLoading] = useState(true)
    const [lastFetchedListing, setLastFetchedListing] = useState(null)
    const [searchField, setSearchField] = useState('')
    const [filteredListings, setfilteredListings] = useState([])
    const params = useParams()

    useEffect(() => 
    {
        const fetchListings = async () =>
        {
            try 
            {
                // Get reference
                const listingsRef = collection(db, 'listings')

                // Create a query
                const q = query (
                    listingsRef,
                    where('offer', '==', true),
                    orderBy('timestamp', 'desc'),
                )

                // Execute query
                const querySnap = await getDocs(q)

                const lastVisible = querySnap.docs[querySnap.docs.length - 1]
                setLastFetchedListing(lastVisible)

                const listings = []

                querySnap.forEach( (doc) => 
                {
                    return listings.push( {id: doc.id, data: doc.data(),} )
                } )

                setListings(listings)
                setfilteredListings(listings)
                setLoading(false)
            } 
            
            catch (error) 
            {
                toast.error('Could not fetch listings')
                console.log(error)
            }
        }

        fetchListings()
    }, [params.categoryName])

    const onSearchChange = (event) =>
    {
        setSearchField(event.target.value)
    }


    useEffect(() => 
    {
        let filterFunction = (list,i) => 
        {
            return listings[i].data.location.toLowerCase().includes(searchField.toLowerCase())
        }

        setfilteredListings(listings.filter(filterFunction))


    }, [searchField])

    /* const onFetchMoreListings = async () =>
    {
        try 
        {
            const listingsRef = collection(db, 'listings')

            const q = query (
                listingsRef,
                where('type', '==', params.categoryName),
                orderBy('timestamp', 'desc'),
                startAfter(lastFetchedListing),
                limit(5)
            )

            const querySnap = await getDocs(q)

            const lastVisible = querySnap.docs[querySnap.docs.length - 1]
            setLastFetchedListing(lastVisible)

            const listings = []

            querySnap.forEach( (doc) => 
            {
                return listings.push( {id: doc.id, data: doc.data(),} )
            } )

            setListings((prevState) => [...prevState, ...listings])
            setLoading(false)
        } 
        
        catch (error) 
        {
            toast.error('Could not fetch listings')
        }
    } */

    return(
        <div className='category'>

            <header>
                <p className='pageHeader'>
                    OFFERS
                </p>
            </header>

            <hr />

            <input 
                type="search" 
                className='formInputName' 
                placeholder='🔍 Search Location' 
                onChange={onSearchChange}
                style={{marginTop: "1rem"}}/>
    
            {
                loading ? 
                    <Spinner /> 

                : listings && listings.length > 0 ? 
                    <>  
                        <main>
                            <ul className='categoryListings'>
                                {filteredListings.map( (listing) => (
                                    <ListingItem 
                                        listing={listing.data} 
                                        id={listing.id}
                                        key={listing.id} 
                                    />
                                ) ) }
                            </ul>
                        </main>

                        <br />
                        <br />

                        {/* {
                            lastFetchedListing && 
                            (
                                <p className='loadMore' onClick={onFetchMoreListings}>
                                    Load More
                                </p>
                            )
                        } */}                    
                    </> 
                : 
                    <p>No listings for {params.categoryName}</p>
            }
            
        </div>
    )


}

export default Category
