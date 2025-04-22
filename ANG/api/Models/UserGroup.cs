using System.ComponentModel.DataAnnotations;


namespace TT_API.Models
{
    public class UserGroup
    {

        [Key]
        public int GroupID { get; set; }
        public string GroupName { get; set; }
    }
}
