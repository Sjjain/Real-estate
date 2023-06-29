import { Link } from 'react-router-dom'
import rentCategoryImage from '../assets/jpg/rentCategoryImage.jpg'
import sellCategoryImage from '../assets/jpg/sellCategoryImage.jpg'
import Slider from '../components/Slider'
import logo from '../assets/jpg/logo.png'

function Explore() 
{
    return (
        <div className='explore'>

            <div className='myHeader'>
                <header> <p className='pageHeader myExplore'> EXPLORE </p> </header>
                <img src={logo} alt=''/>
            </div>

            
            <main>

                {/* <Slider /> */}

                <p className='exploreCategoryHeading'> CATEGORIES </p>

                <div className='exploreCategories'>
                    <Link to='/category/rent'>
                        <img
                            src={rentCategoryImage}
                            alt='rent'
                            className='exploreCategoryImg'
                        />
                    </Link>

                    <Link to='/category/sale'>
                        <img
                            src={sellCategoryImage}
                            alt='sell'
                            className='exploreCategoryImg'
                        />
                    </Link>
                </div>

            </main>

        </div>
    )
}

export default Explore